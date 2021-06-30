exports.up = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('category', 'int').notNullable().alter();
      t.specificType('vout', 'int').notNullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.enum('category', ['0', '1', '2', '3']).nullable().alter();
      t.specificType('vout', 'int').nullable().alter();
   })
};