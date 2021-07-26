exports.up = function(knex) {
   return knex.schema.table('rewards', function(t) {
      t.specificType('reputation', 'double').defaultTo('0').notNullable();
   })
};

exports.down = function(knex) {
   return knex.schema.table('rewards', function(t) {
      t.dropColumn('reputation');
   })
};