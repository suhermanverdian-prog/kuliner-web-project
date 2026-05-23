const GrabFoodChannel = require('./channels/GrabFoodChannel');
// const ShopeeFoodChannel = require('./channels/ShopeeFoodChannel');

class ChannelFactory {
  static getChannel(channelName, tenantId, config = {}) {
    switch (channelName.toLowerCase()) {
      case 'grabfood':
        return new GrabFoodChannel(tenantId, config);
      // case 'shopeefood':
      //   return new ShopeeFoodChannel(tenantId, config);
      default:
        throw new Error(`Channel ${channelName} is not supported yet.`);
    }
  }
}

module.exports = ChannelFactory;
