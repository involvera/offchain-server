exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropColumn('content_link');
      t.dropColumn('vote');
      t.dropColumn('end_at');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('content_link').notNullable();
      t.text('vote').notNullable();
      t.specificType('end_at', 'mediumint unsigned');
   })
};