exports.up = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('vout', 'int').alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('reactions', function(t) {
      t.specificType('vout', 'tinyint unsigned').alter();
   })
};