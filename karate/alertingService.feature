Feature: Alerting service

    Background:

        * def result = callonce read('getToken.feature')
        * def token = result.token

    Scenario: Post new mapping

        * def uid = 'felnpmalm991cb'
        * def cardOptions =
        """
        {
            "recipients" : ["ENTITY1_FR"],
            "title": "karate test",
            "firingSeverity" : "ACTION",
            "resolvedSeverity" : "INFORMATION"
        }
        """

        Given url alertingServiceUrl + 'mapping/' + uid
        And header Authorization = 'Bearer ' + token
        And request cardOptions
        When method post
        Then status 204

        Given url alertingServiceUrl + 'mapping'
        And header Authorization = 'Bearer ' + token
        When method get
        Then status 200
        * def mapping = response.mappings.filter(x => x[0] == uid)[0]
        * match mapping[1] == cardOptions

    Scenario: Send alert without authentication

        Given url alertingServiceUrl + 'alerts'
        And request {}
        When method post
        Then status 401

    Scenario: Send firing alert

        * def alertNotification =
        """
        {
            "alerts" : [
                {
                    "status" : "firing",
                    "startsAt" : 1735689600000,
                    "endsAt" : "0001-01-01T00:00:00Z",
                    "generatorURL" : "grafana/felnpmalm991cb",
                    "fingerprint" : "karateTestAlert"
                }
            ]
        }
        """

        Given url alertingServiceUrl + 'alerts'
        And header Authorization = grafanaAuthHeader
        And request alertNotification
        When method post
        Then status 200

    Scenario: Check firing card

        Given url opfabCardsConsultationUrl + 'cards/alertingProcess.karateTestAlert1735689600000'
        And header Authorization = 'Bearer ' + token
        When method get
        Then status 200
        * def card = response.card
        * match card.entityRecipients contains 'ENTITY1_FR'
        * match card.titleTranslated == 'karate test'
        * match card.severity == 'ACTION'

    Scenario: Send resolved alert

        * def alertNotification =
        """
        {
            "alerts" : [
                {
                    "status" : "resolved",
                    "startsAt" : 1735689600000,
                    "endsAt" : 1735689660000,
                    "generatorURL" : "grafana/felnpmalm991cb",
                    "fingerprint" : "karateTestAlert"
                }
            ]
        }
        """

        Given url alertingServiceUrl + 'alerts'
        And header Authorization = grafanaAuthHeader
        And request alertNotification
        When method post
        Then status 200

    Scenario: Check resolved card

        Given url opfabCardsConsultationUrl + 'cards/alertingProcess.karateTestAlert1735689600000'
        And header Authorization = 'Bearer ' + token
        When method get
        Then status 200
        * def card = response.card
        * match card.entityRecipients contains 'ENTITY1_FR'
        * match card.titleTranslated == 'karate test'
        * match card.severity == 'INFORMATION'
    
    Scenario: Delete mapping

        * def uid = 'felnpmalm991cb'

        Given url alertingServiceUrl + 'mapping/' + uid
        And header Authorization = 'Bearer ' + token
        When method delete
        Then status 204

        Given url alertingServiceUrl + 'mapping'
        And header Authorization = 'Bearer ' + token
        When method get
        Then status 200
        * def check = response.mappings.filter(x => x[0] == uid)
        * match check == []
