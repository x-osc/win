import type { AppApi } from "./app/api";
import type { App, AppManifest } from "./app/app";
import { registerApp } from "./app/apps.svelte";
import { winDataBuilder } from "./wm/wm.svelte";

class TestApp implements App {
  api: AppApi;

  constructor(api: AppApi) {
    this.api = api;
  }

  launch(): void {
    console.log("yipe it worke");
    this.api.window
      .createWindowAsync(winDataBuilder().withTitle("test_app").build())
      .then((winApi) => {
        let body = winApi.getBody();
        console.log(body);
        if (body !== null) {
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
        }
      });
  }
}

export let testAppManifest: AppManifest = {
  appId: "test_app",
  createApp: (api: AppApi) => new TestApp(api),
};
