exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.renameColumn('author_public_key_hashed', 'author');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.renameColumn('author', 'author_public_key_hashed');
   })
};