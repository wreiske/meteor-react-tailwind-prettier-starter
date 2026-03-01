/**
 * Todos feature — API (collection, publication, methods, indexes, rate-limiting).
 *
 * This file is the single import you need on the server to enable the feature.
 * To disable todos: remove this import from server/main.ts and remove the
 * route entry from AppLayout.tsx.
 */
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { type TodoDoc, todoIdSchema, todoTextSchema } from './schema';

export type { TodoDoc } from './schema';
export type { TodoFilter } from './schema';

export const Todos = new Mongo.Collection<TodoDoc>('todos');

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Indexes (idempotent)
    await Todos.createIndexAsync({ userId: 1, createdAt: -1 });
    await Todos.createIndexAsync({ userId: 1, done: 1 });

    // Per-user rate limiting
    const METHODS = ['todos.insert', 'todos.toggle', 'todos.remove', 'todos.clearCompleted'];
    DDPRateLimiter.addRule(
      {
        name: (n) => METHODS.includes(n),
        userId: () => true,
      },
      30,
      10_000,
    );
  });

  // Publication — optionally filtered by status
  Meteor.publish('todos.list', function (opts?: { status?: 'active' | 'completed' }) {
    if (!this.userId) return this.ready();
    if (opts) {
      try {
        check(opts, { status: Match.Maybe(Match.OneOf('active', 'completed')) });
      } catch {
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
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const result = todoTextSchema.safeParse(text);
      if (!result.success)
        throw new Meteor.Error('validation', result.error.issues[0]?.message ?? 'Invalid input');
      const clean = result.data;
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
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const id = todoIdSchema.parse(todoId);
      const doc = await Todos.findOneAsync({ _id: id, userId: this.userId });
      if (!doc) throw new Meteor.Error('not-found');
      await Todos.updateAsync(id, { $set: { done: !doc.done } });
    },
    async 'todos.remove'(todoId: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const id = todoIdSchema.parse(todoId);
      await Todos.removeAsync({ _id: id, userId: this.userId });
    },
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
      const bulk = Todos.rawCollection().initializeUnorderedBulkOp();
      orderedIds.forEach((id, idx) => {
        bulk.find({ _id: id, userId: this.userId }).updateOne({ $set: { order: idx + 1 } });
      });
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
