exports.up = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.dateTime('created_at').defaultTo(knex.raw('now()')).alter();
   })
};

exports.down = function(knex) {
   return Promise.all([
      knex.raw(`ALTER TABLE reactions ALTER COLUMN created_at DROP DEFAULT`)
   ])
};