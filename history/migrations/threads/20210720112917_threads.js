exports.up = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.dropColumn('embed_list');
   })
};

exports.down = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.text('embed_list');
   })
};