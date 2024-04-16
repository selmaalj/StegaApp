import React from 'react';
import { StyleSheet, Text, View} from 'react-native';

export default function Header(){
    return(
        <View style={styles.header}>
            <Text style={styles.title}>
                StegaStamp
            </Text>
        </View>
    )
}

const styles=StyleSheet.create({
    header: {
        height: 80,
        padingTop: 38,
        backgroundColor: 'coral'
    },
    title: {
        textAlign: 'center',
        color: 'lightgrey',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20
    }
})