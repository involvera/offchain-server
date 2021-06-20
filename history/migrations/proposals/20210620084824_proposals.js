exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.foreign('author').references('address').inTable('aliases');
      t.unique('author');
      t.string('author', 40).notNullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropUnique('author');
      t.dropForeign('author');
      t.string('author', 34).nullable().alter();
   })
};