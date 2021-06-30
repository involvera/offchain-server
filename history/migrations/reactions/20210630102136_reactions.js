exports.up = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('vout', 'int').nullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('vout', 'int').notNullable().alter();
   })
};