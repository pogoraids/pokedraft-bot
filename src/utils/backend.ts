import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import gql from "graphql-tag";
import { fetch } from 'cross-fetch/polyfill';

export class BackendService {
    static apolloClient: ApolloClient<any>;

    async loginUser() {
        const query = gql`
        query {
          loginUser(email: "${process.env.API_ADMIN_USER}", password: "${process.env.API_ADMIN_PASSWORD}") {
            id
            jwt
            email
          }
        }
        `;

        let {data: {loginUser}}: any = await BackendService.apolloClient.query({
            query
        });
        
        return loginUser;
    }
}