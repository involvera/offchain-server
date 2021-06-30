exports.up = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('vout', 'int').defaultTo('0').alter();
   })
};

exports.down = function(knex) {
   return Promise.all([
      knex.raw(`ALTER TABLE reactions ALTER COLUMN vout DROP DEFAULT`)
   ])
};