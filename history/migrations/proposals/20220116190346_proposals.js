exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.string('context', 15000).alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('context').alter();
   })
};