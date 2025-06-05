Feature: Get token

  Scenario:

    Given url opfabUrl + 'auth/token'
    And form field username = 'admin'
    And form field password = 'test'
    And form field grant_type = 'password'
    When method post
    Then status 200
    And def token = response.access_token
