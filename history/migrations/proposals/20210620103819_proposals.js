exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.foreign('author').references('address').inTable('aliases');
      t.string('author', 39).alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropForeign('author');
      t.string('author', 39).alter();
   })
};