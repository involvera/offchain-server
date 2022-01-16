exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.specificType('end_at', 'mediumint unsigned').alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dateTime('end_at').alter();
   })
};