exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('author', 39).unique().references('address').inTable('aliases').notNullable();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropForeign('author');
      t.dropUnique('author');
      t.dropColumn('author');
   })
};