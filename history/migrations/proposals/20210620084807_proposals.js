exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('author', 34).alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('author').alter();
   })
};