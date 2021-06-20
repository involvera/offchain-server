exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.renameColumn('public_key_hashed', 'address');
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.renameColumn('address', 'public_key_hashed');
   })
};