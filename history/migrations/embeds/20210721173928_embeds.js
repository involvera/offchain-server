exports.up = function(knex) {
   return knex.schema.table('embeds', function(t) {
      t.specificType('index', 'int').alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('embeds', function(t) {
      t.specificType('index', 'int unsigned').alter();
   })
};