/**
* @license seam https://github.com/flams/seam
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Olivier Scherrer <pode.fr@gmail.com>
*/
require("quick-dom");

var Seam = require("../index");

describe("Seam", function () {
    var seam = null,
        plugin = {};

    beforeEach(function () {
        seam = new Seam();
    });

    it("can be directly initialized with a set of plugins", function () {
        var plugin = {},
            seam = new Seam({plugin: plugin});

        expect(seam.get("plugin")).toBe(plugin);
    });

    it("should allow for adding plugins", function () {

        expect(seam.add()).toBe(false);
        expect(seam.add("test")).toBe(false);
        expect(seam.add("test", null)).toBe(false);
        expect(seam.add(plugin, "test")).toBe(false);
        expect(seam.add("test", plugin)).toBe(true);

        expect(seam.get("test")).toBe(plugin);
    });

    it("should allow for removing plugins", function () {
        seam.add("test", plugin);

        expect(seam.del("test")).toBe(true);
        expect(seam.get("test")).toBeUndefined();
        expect(seam.del("test")).toBe(true);
    });

    it("should allow for adding multiple plugins at once", function () {
        var plugin1 = {},
            plugin2 = {};

        spyOn(seam, "add").andCallThrough();

        seam.addAll({
            "plugin1": plugin1,
            "plugin2": plugin2
        });


        expect(seam.add.wasCalled).toBe(true);
        expect(seam.add.callCount).toBe(2);

        expect(seam.get("plugin1")).toBe(plugin1);
        expect(seam.get("plugin2")).toBe(plugin2);
    });

});

describe("SeamPluginCall", function () {

    var seam = null,
        plugin1 = null,
        plugin2 = null,
        dom = null;

    beforeEach(function () {
        var i=3;

        dom = document.createElement("div");

        while (i--) {
            dom.appendChild(document.createElement("p"));
        }

        seam = new Seam();
        plugin1 = {
            method: jasmine.createSpy()
        };

        plugin2 = {
            method1: jasmine.createSpy(),
            method2: jasmine.createSpy()
        };
    });

    it("should apply the plugins only on dom nodes", function () {
        expect(function () {
            seam.apply();
        }).toThrow();
        expect(function () {
            seam.apply({});
        }).toThrow();
        expect(seam.apply(dom)).toBe(dom);
    });

    it("should call the plugins on apply", function () {
        dom.setAttribute("data-plugin1", "method");
        seam.apply(dom);
        expect(plugin1.method.wasCalled).toBe(false);

        seam.add("plugin1", plugin1);
        seam.apply(dom);
        expect(plugin1.method.wasCalled).toBe(true);
        expect(plugin1.method.callCount).toBe(1);
        expect(plugin1.method.mostRecentCall.object).toBe(plugin1);
    });

    it("should call multiple plugins on apply", function () {
        dom.innerHTML = '<span data-plugin1="method"></span><p data-plugin2="method1"></p>';
        dom.innerHTML += '<div data-plugin1="method" data-plugin2="method1;method2"></div>';

        seam.add("plugin1", plugin1);
        seam.add("plugin2", plugin2);

        seam.apply(dom);
        expect(plugin1.method.callCount).toBe(2);
        expect(plugin1.method.mostRecentCall.object).toBe(plugin1);
        expect(plugin2.method1.callCount).toBe(2);
        expect(plugin2.method1.mostRecentCall.object).toBe(plugin2);
        expect(plugin2.method2.callCount).toBe(1);
        expect(plugin2.method2.mostRecentCall.object).toBe(plugin2);

    });


    it("should call also if spaces are present between two methods", function () {
        dom.setAttribute("data-plugin2", "method1; method2");
        seam.add("plugin2", plugin2);
        seam.apply(dom);
        expect(plugin2.method2.wasCalled).toBe(true);
    });

    it("should'nt fail if no such method", function () {
        dom.setAttribute("data-plugin2", "method3");
        seam.add("plugin2", plugin2);
        expect(function () {
            seam.apply(dom);
        }).not.toThrow();

        expect(plugin2.method2.wasCalled);
    });

    it("should pass parameters to the method", function () {
        dom.setAttribute("data-plugin2", "method1:param1, param2; method2: param1");
        seam.add("plugin2", plugin2);
        seam.apply(dom);
        expect(plugin2.method1.callCount).toBe(1);
        expect(plugin2.method1.mostRecentCall.args[0]).toBe(dom);
        expect(plugin2.method1.mostRecentCall.args[1]).toBe("param1");
        expect(plugin2.method1.mostRecentCall.args[2]).toBe("param2");
        expect(plugin2.method2.mostRecentCall.args[0]).toBe(dom);
        expect(plugin2.method2.mostRecentCall.args[1]).toBe("param1");
    });

});

describe("SeamApplyAvailableToPlugin", function (){

    var seam = null,
        plugin = null;

    beforeEach(function () {
        seam = new Seam();
        plugin = {};
        seam.add("plugin", plugin);
    });

    it("should decorate with a plugins property", function () {
        expect(typeof plugin.plugins).toBe("object");
    });

    it("should decorate with a name property that holds the plugin's name", function () {
        expect(plugin.plugins.name).toBe("plugin");
    });

    it("should decorate with an apply function", function () {
        var div = document.createElement("div"),
            applied;
        spyOn(seam, "apply").andCallThrough();
        applied = plugin.plugins.apply(div);

        expect(seam.apply.wasCalled).toBe(true);
        expect(seam.apply.mostRecentCall.object).toBe(seam);
        expect(seam.apply.mostRecentCall.args[0]).toBe(div);
        expect(applied).toBe(div);
    });
});
