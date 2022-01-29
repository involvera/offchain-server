exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('activity', 350);
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.dropColumn('activity');
   })
};