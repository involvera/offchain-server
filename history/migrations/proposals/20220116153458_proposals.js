exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('content').alter();
      t.text('prev');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropColumn('prev');
      t.string('content', 15000).alter();
   })
};