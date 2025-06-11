import { GraphQLClient } from "graphql-request";
import { getSdk } from "../../generated/graphql";
import { createResource } from "solid-js";

export default function graphql() {
   createResource(async () => {
      await getData();
   });

   return <p>HELLO</p>;
}

async function getData() {
   const client = new GraphQLClient("http://localhost:8000/graphql", {});
   const sdk = getSdk(client);
   const { tgtg } = await sdk.getItems();
   // __AUTO_GENERATED_PRINT_VAR_START__
   console.log("custom print var getData tgtg: %s", JSON.stringify(tgtg, null, 3)); // __AUTO_GENERATED_PRINT_VAR_END__
}
