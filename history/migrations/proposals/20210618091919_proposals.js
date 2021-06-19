exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('signature', 200).alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('signature', 72).alter();
   })
};