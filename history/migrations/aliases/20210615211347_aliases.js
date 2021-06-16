exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('pp', 255).notNullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.text('pp', 'mediumtext').nullable().alter();
   })
};