exports.up = function(knex) {
   return Promise.all([])
};

exports.down = function(knex) {
   return Promise.all([
      knex.raw(`ALTER TABLE aliases CHANGE id id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT FIRST`)
   ])
};