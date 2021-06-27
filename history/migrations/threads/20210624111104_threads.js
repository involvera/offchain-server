exports.up = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.string('first_embed', 1000);
   })
};

exports.down = function(knex) {
   return Promise.all([])
};