exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.renameColumn('prev', 'context');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.renameColumn('context', 'prev');
   })
};