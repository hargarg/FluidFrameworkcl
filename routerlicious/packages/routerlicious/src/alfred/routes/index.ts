import * as ensureAuth from "connect-ensure-login";
import { Router } from "express";
import { Provider } from "nconf";
import { IDocumentStorage, ITenantManager } from "../../core";
import * as utils from "../../utils";
import { IAlfredTenant } from "../tenant";
import * as agent from "./agent";
import * as api from "./api";
import * as canvas from "./canvas";
import * as cell from "./cell";
import * as demoCreator from "./democreator";
import * as home from "./home";
import * as intelligence from "./intelligence";
import * as loader from "./loader";
import * as maps from "./maps";
import * as scribe from "./scribe";
import * as sharedText from "./sharedText";
import * as templates from "./templates";

export interface IRoutes {
    agent: Router;
    api: Router;
    canvas: Router;
    cell: Router;
    demoCreator: Router;
    loader: Router;
    home: Router;
    intelligence: Router;
    signUp: Router;
    maps: Router;
    scribe: Router;
    sharedText: Router;
    templates: Router;
}

export function create(
    config: Provider,
    tenantManager: ITenantManager,
    mongoManager: utils.MongoManager,
    storage: IDocumentStorage,
    producer: utils.IProducer,
    appTenants: IAlfredTenant[]) {

    const ensureLoggedIn = config.get("login:enabled") ? ensureAuth.ensureLoggedIn :
        (options) => {
            return (req, res, next) => next();
        };

    return {
        agent: agent.create(config),
        api: api.create(config, tenantManager, storage, mongoManager, producer, appTenants),
        canvas: canvas.create(config, tenantManager, storage, appTenants, ensureLoggedIn),
        cell: cell.create(config, tenantManager, storage, appTenants, ensureLoggedIn),
        demoCreator: demoCreator.create(config, ensureLoggedIn),
        home: home.create(config, ensureLoggedIn),
        intelligence: intelligence.create(config),
        loader: loader.create(config, tenantManager, storage, appTenants, ensureLoggedIn),
        maps: maps.create(config, tenantManager, storage, appTenants, ensureLoggedIn),
        scribe: scribe.create(config, tenantManager, appTenants, ensureLoggedIn),
        sharedText: sharedText.create(config, tenantManager, storage, appTenants, ensureLoggedIn),
        templates: templates.create(config),
    };
}
