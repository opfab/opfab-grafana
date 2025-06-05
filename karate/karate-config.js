function() {
  var Base64 = Java.type('java.util.Base64');
  var grafanaCredentialsEncoded = Base64.getEncoder().encodeToString('grafana:test'.getBytes());
  var config = { // base config JSON
    opfabUrl: "http://localhost:2002/",
    opfabCardsConsultationUrl: "http://localhost:2104/",
    alertingServiceUrl: "http://localhost:2109/",
    grafanaAuthHeader: 'Basic ' + grafanaCredentialsEncoded
  };
  // don't waste time waiting for a connection or if servers don't respond within 5 seconds
  karate.configure('connectTimeout', 10000);
  karate.configure('readTimeout', 10000);
  return config;
}
