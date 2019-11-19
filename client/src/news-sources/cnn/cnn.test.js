const {
  __impl: { parseAuthorInformation, parsePublicationDateInformation },
} = require('./')

describe('parsing utils', () => {
  it('parses publication dates', () => {
    const tests = ['Updated 1:13 AM ET, Sat November 2, 2019']
    expect(tests.map(parsePublicationDateInformation)).toMatchSnapshot()
  })

  it('parses authors info', () => {
    const tests = [['Opinion by Lori Harrison-Kahan']]
    expect(tests.map(parseAuthorInformation)).toMatchSnapshot()
  })
})
