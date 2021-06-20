exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('author_public_key_hashed').nullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('author_public_key_hashed', 40).notNullable().alter();
   })
};