exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.text('pp', 'mediumtext').alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.text('pp', 'mediumtext').alter();
   })
};