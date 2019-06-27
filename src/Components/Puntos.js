import React, { Component } from 'react';
import AccionesRecientes from './AccionesRecientes';
import { Header, Container, Divider, Form, Segment, TextArea, Input} from 'semantic-ui-react';

const options = [
    { key: 'o1', text: 'Other1', value: 'other' },
    { key: 'o2', text: 'Other2', value: 'other' },
    { key: 'o3', text: 'Other3', value: 'other' },
  ]

export default class Puntos extends Component {
    render() {
        return (
            <Container fluid={true}>  
                <Header as='h2' className='headerContainer' block>
                  Dashboard
                </Header> 
                
                <Segment raised>
                <Form fluid="fluid" widths='equal'>
                    <Header as='h3' >Regalar Puntos</Header>
                    <Divider/>
                    <Form.Group inline>
                        De ###{} puntos, quiero dar <Input></Input> puntos a <Form.Select options={options}/>
                    </Form.Group>
                    <Form.Group >
                        por: 
                        <TextArea></TextArea>
                    </Form.Group>
                    <Form.Button align='center'>Regalar</Form.Button>
                </Form>
            </Segment>
                
                <AccionesRecientes/>
            </Container>
        )
    }
}

