function Profile(data, raw) {
  this.displayName = data.name;
  this.id = data.uid || data.sub;
  this.uid = this.id;

  if (data.identities) {
    this.provider = data.identities[0].provider;
  } else if (typeof this.id === 'string' && this.id.indexOf('|') > -1 ) {
    this.provider = this.id.split('|')[0];
  }

  this.name = {
    lastName: data.lastName,
    firstName: data.firstName
  };

  if (data.emails) {
    this.emails = data.emails.map(function (email) {
      return { value: email };
    });
  } else if (data.email) {
    this.emails = [{
      value: data.email
    }];
  }

  //copy these fields
  ['photoURL',
   'locale',
   'displayName',
   'gender',
   'identities'].filter(function (k) {
    return k in data;
  }).forEach(function (k) {
    this[k] = data[k];
  }.bind(this));

  this._json = data;
  this._raw = raw;
}

module.exports = Profile;