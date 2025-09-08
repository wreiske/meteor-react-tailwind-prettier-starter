import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export interface TodoDoc {
  _id?: string;
  userId: string;
  text: string;
  done: boolean;
  createdAt: Date;
}

export const Todos = new Mongo.Collection<TodoDoc>('todos');

if (Meteor.isServer) {
  Meteor.publish('todos.list', function () {
    if (!this.userId) return this.ready();
    return Todos.find({ userId: this.userId }, { sort: { createdAt: -1 } });
  });

  Meteor.methods({
    async 'todos.insert'(text: string) {
      check(text, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const clean = text.trim();
      if (!clean) throw new Meteor.Error('empty', 'Todo text required');
      if (clean.length > 200) throw new Meteor.Error('too-long', 'Keep it under 200 chars');
      return Todos.insertAsync({
        userId: this.userId,
        text: clean,
        done: false,
        createdAt: new Date(),
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
  });
}
