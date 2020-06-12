import React, { Component } from 'react';
import { Icon, Container } from 'semantic-ui-react';

export default class Loading extends Component {
   render() {
      return (
         <Container textAlign="center">
            <h1>
               <Icon loading name="hourglass half" /> Loading...
            </h1>
         </Container>
      );
   }
}
