import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export interface TodoDoc {
  _id?: string;
  userId: string;
  text: string;
  done: boolean;
  createdAt: Date;
  order?: number; // lower comes first
}

export const Todos = new Mongo.Collection<TodoDoc>('todos');

if (Meteor.isServer) {
  // Publication optionally filtered by status ("active" => done:false, "completed" => done:true)
  Meteor.publish('todos.list', function (opts?: { status?: 'active' | 'completed' }) {
    if (!this.userId) return this.ready();
    // Validate opts defensively; tolerate undefined
    if (opts) {
      try {
        check(opts, {
          status: Match.Maybe(Match.OneOf('active', 'completed')),
        });
      } catch {
        // On invalid args just publish nothing rather than throwing (avoids noisy client errors)
        return this.ready();
      }
    }
    const selector: Mongo.Selector<TodoDoc> = { userId: this.userId };
    if (opts?.status === 'active') selector.done = false;
    else if (opts?.status === 'completed') selector.done = true;
    return Todos.find(selector, { sort: { order: 1, createdAt: -1 } });
  });

  Meteor.methods({
    async 'todos.insert'(text: string) {
      check(text, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const clean = text.trim();
      if (!clean) throw new Meteor.Error('empty', 'Todo text required');
      if (clean.length > 200) throw new Meteor.Error('too-long', 'Keep it under 200 chars');
      // Determine next order (max + 1). If no existing, start at 1.
      const last = await Todos.findOneAsync(
        { userId: this.userId },
        { sort: { order: -1 }, fields: { order: 1 } },
      );
      const nextOrder = typeof last?.order === 'number' ? last.order + 1 : 1;
      return Todos.insertAsync({
        userId: this.userId,
        text: clean,
        done: false,
        createdAt: new Date(),
        order: nextOrder,
      });
    },
    async 'todos.toggle'(todoId: string) {
      check(todoId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const doc = await Todos.findOneAsync({ _id: todoId, userId: this.userId });
      if (!doc) throw new Meteor.Error('not-found');
      await Todos.updateAsync(todoId, { $set: { done: !doc.done } });
    },
    async 'todos.remove'(todoId: string) {
      check(todoId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      await Todos.removeAsync({ _id: todoId, userId: this.userId });
    },
    // Example method demonstrating optimistic UI potential
    async 'todos.clearCompleted'() {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      await Todos.removeAsync({ userId: this.userId, done: true });
    },
    async 'todos.reorder'(orderedIds: string[]) {
      check(orderedIds, [String]);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      if (orderedIds.length === 0) return true;
      const userTodos = await Todos.find(
        { userId: this.userId },
        { fields: { _id: 1 } },
      ).fetchAsync();
      const userIds = new Set(userTodos.map((t) => t._id));
      for (const id of orderedIds) {
        if (!userIds.has(id))
          throw new Meteor.Error('invalid-order', 'Invalid todo id in ordering');
      }
      // Apply new order indices starting at 1. Use bulkWrite for efficiency.
      const bulk = Todos.rawCollection().initializeUnorderedBulkOp();
      orderedIds.forEach((id, idx) => {
        bulk.find({ _id: id, userId: this.userId }).updateOne({ $set: { order: idx + 1 } });
      });
      // Assign remaining (if any not included) after—should not happen if client sends full list.
      userTodos
        .filter((t) => !orderedIds.includes(t._id!))
        .forEach((t) => {
          bulk
            .find({ _id: t._id, userId: this.userId })
            .updateOne({ $set: { order: orderedIds.length + 1 } });
        });
      await bulk.execute();
      return true;
    },
  });
}
