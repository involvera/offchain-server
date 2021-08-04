exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dateTime('end_at');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropColumn('end_at');
   })
};