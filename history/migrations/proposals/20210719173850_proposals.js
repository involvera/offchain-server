exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('embed_list');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropColumn('embed_list');
   })
};