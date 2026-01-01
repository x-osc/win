import type { AppApi } from "./app/api";
import type { AppManifest } from "./app/app";
import { winDataBuilder } from "./wm/wm.svelte";

async function launch(api: AppApi) {
  console.log("yipe it worke");
  api.window
    .createWindowAsync(winDataBuilder().withTitle("test_app").build())
    .then((winApi) => {
      console.log(winApi.getData().owner);
      let body = winApi.getBody();
      console.log(body);
      body.innerHTML = `
        <h1>welcom to my ebic app</h1>
        <p>its got woords</p>
        <p>so amaizing ama i rite gang</p>
        <p>
        askdjfkgljakdjdfsjflksdfmklsdnalvkjsdlfj
        asdkjklsdmclvkmsdklfj
        asdlkmclkamsdlkfjselfkml;kf;ldjflskadmf
        jlksfjlisejrelsfjlsekmfldsfms;dfskd;jflkds
        asjlkdfjvkladsfjtepotigpodjfklsjd
        jskldfjsdlmfsd;fjoejfolsemklafjsldkjflkasdmnf
        ashgsdkjelwfojeslfilsefjadlksfj;sdkfsaklfjdf
        </p>
      `;
      winApi.on("focus", () => {
        console.log("fjdkjfk");
      });
      winApi.on("close", () => {
        console.log("asdfjkl");
        alert("r u sure");
        api.quit();
      });
    });
}

export let testAppManifest: AppManifest = {
  appId: "test_app",

  launch,
};
