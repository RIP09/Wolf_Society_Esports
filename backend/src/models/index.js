const User = require('./User');
const Player = require('./Player');
const Team = require('./Team');
const Match = require('./Match');
const Announcement = require('./Announcement');
const Content = require('./Content');
const Contract = require('./Contract');

// Associations
User.hasOne(Player, { foreignKey: 'user_id' });
Player.belongsTo(User, { foreignKey: 'user_id' });

Team.hasMany(Player, { foreignKey: 'team_id' });
Player.belongsTo(Team, { foreignKey: 'team_id' });

Team.hasMany(Match, { foreignKey: 'team_id' });
Match.belongsTo(Team, { foreignKey: 'team_id' });

User.hasMany(Announcement, { foreignKey: 'author_id' });
Announcement.belongsTo(User, { foreignKey: 'author_id' });

User.hasMany(Content, { foreignKey: 'uploader_id' });
Content.belongsTo(User, { foreignKey: 'uploader_id' });

User.hasMany(Contract, { foreignKey: 'user_id' });
Contract.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Player,
  Team,
  Match,
  Announcement,
  Content,
  Contract,
};
