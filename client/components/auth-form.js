import React from 'react'
import {connect} from 'react-redux'
import PropTypes from 'prop-types'
import {auth} from '../store'
import {Form, Button, Container} from 'semantic-ui-react'

/**
 * COMPONENT
 */
const AuthForm = props => {
  const {name, displayName, handleSubmit, error} = props

  return (
    <div style={{backgroundColor: '#0F2027', padding: '1em', height: '100vh'}}>
      <Form onSubmit={handleSubmit} name={name}>
        <Form.Field style={{marginLeft: '6%'}}>
          <div>
            <label htmlFor="email" />
            <input placeholder="email" required name="email" type="text" />
          </div>
        </Form.Field>

        <Form.Field>
          <div>
            <label htmlFor="password" />
            <input
              placeholder="password"
              required
              name="password"
              type="password"
            />
          </div>
        </Form.Field>
        <Container>
          <Form.Button type="submit" style={{marginRight: '1em'}}>
            {displayName}
          </Form.Button>

          <Button color="google plus" to="/auth/google">
            {displayName} with Google
          </Button>
        </Container>
        {error && error.response && <div>{error.response.data}</div>}
      </Form>
    </div>
  )
}

/**
 * CONTAINER
 *   Note that we have two different sets of 'mapStateToProps' functions -
 *   one for Login, and one for Signup. However, they share the same 'mapDispatchToProps'
 *   function, and share the same Component. This is a good example of how we
 *   can stay DRY with interfaces that are very similar to each other!
 */
const mapLogin = state => {
  return {
    name: 'login',
    displayName: 'Login',
    error: state.user.error
  }
}

const mapSignup = state => {
  return {
    name: 'signup',
    displayName: 'Sign Up',
    error: state.user.error
  }
}

const mapDispatch = dispatch => {
  return {
    handleSubmit(evt) {
      evt.preventDefault()
      const formName = evt.target.name
      const email = evt.target.email.value
      const password = evt.target.password.value
      dispatch(auth(email, password, formName))
    }
  }
}

export const Login = connect(mapLogin, mapDispatch)(AuthForm)
export const Signup = connect(mapSignup, mapDispatch)(AuthForm)

/**
 * PROP TYPES
 */
AuthForm.propTypes = {
  name: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  error: PropTypes.object
}
