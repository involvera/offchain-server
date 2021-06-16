exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('pp', 255).nullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('pp', 255).notNullable().alter();
   })
};