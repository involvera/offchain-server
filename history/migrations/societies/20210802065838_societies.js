exports.up = function(knex) {
   return knex.schema.table('societies', function(t) {
      t.string('pp', 255);
   })
};

exports.down = function(knex) {
   return knex.schema.table('societies', function(t) {
      t.dropColumn('pp');
   })
};