exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('address', 39).alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('address', 40).alter();
   })
};