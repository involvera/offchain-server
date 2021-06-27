exports.up = function(knex) {
   return Promise.all([
      knex.raw(`ALTER TABLE threads CHANGE id id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT FIRST`)
   ])
};

exports.down = function(knex) {
   return Promise.all([])
};