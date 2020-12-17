odoo.define('pos_order_history.OrderHistoryScreen', function (require) {
    'use strict';

    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var rpc = require('web.rpc');
    var models = require('point_of_sale.models');
    var PosModelSuper = models.PosModel;
    const ProductScreen = require('point_of_sale.ProductScreen');


 models.load_models({
            model: 'pos.order',
            fields: ['id', 'name', 'session_id', 'state', 'pos_reference', 'partner_id', 'amount_total','lines', 'amount_tax','sequence_number', 'fiscal_position_id', 'pricelist_id', 'create_date'],
            domain: function(self){ return [['company_id','=',self.company.id]]; },
            loaded: function (self, pos_orders) {
            var orders = [];
            for (var i in pos_orders){
                orders[pos_orders[i].id] = pos_orders[i];


            }
            self.pos_orders = orders;
            self.order = [];
            for (var i in pos_orders){
                self.order[i] = pos_orders[i];

            }


        },

    });

models.PosModel = models.PosModel.extend({
  _save_to_server: function (orders, options) {
   var result_new = PosModelSuper.prototype._save_to_server.call(this, orders, options);
   var self = this;
   var new_order = {};
   var orders_list = self.pos_orders;
    for (var i in orders) {
      var partners = self.partners;

      var partner = "";
      for(var j in partners){
           if(partners[j].id == orders[i].data.partner_id){
                partner = partners[j].name;
             }
         }
            new_order = {
                'amount_tax': orders[i].data.amount_tax,
                'amount_total': orders[i].data.amount_total,
                'pos_reference': orders[i].data.name,
                'partner_id': [orders[i].data.partner_id, partner],
                'session_id': [self.pos_session.id, self.pos_session.name]
            };
            orders_list.push(new_order);
            self.pos_orders = orders_list;
            self.gui.screen_instances.ShowOrdersWidget.render_list(orders_list);
        }
        return result_new;
    },
});




class OrderHistoryScreen extends IndependentToOrderScreen {
        constructor() {
            super(...arguments);
            useListener('close-screen', this.close);
            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            var self =this;
            this.searchDetails = {};
            this.filter = null;
            this._initializeSearchFieldConstants();
            console.log("this",self);
        }
//        mounted() {
//            posbus.on('ticket-button-clicked', this, this.close);
//            this.env.pos.get('orders').on('add remove change', () => this.render(), this);
//            this.env.pos.on('change:selectedOrder', () => this.render(), this);
//        }
//        willUnmount() {
//            posbus.off('ticket-button-clicked', this);
//            this.env.pos.get('orders').off('add remove change', null, this);
//            this.env.pos.off('change:selectedOrder', null, this);
//        }
//        _onFilterSelected(event) {
//            this.filter = event.detail.filter;
//            this.render();
//        }
//        _onSearch(event) {
//            const searchDetails = event.detail;
//            Object.assign(this.searchDetails, searchDetails);
//            this.render();
//        }
//        /**
//         * Override to conditionally show the new ticket button.
//         */
//        get showNewTicketButton() {
//            return true;
//        }
//        get orderList() {
//            console.log("order list",this.env.pos.order)
//            return this.env.pos.get_order_list();
////            this.get('orders').models;
//        }
        get filteredOrderList() {
           var data = this.env.pos.order
           for(var order in data){
           order.name


           }
        }
        selectOrder(order) {
        console.log("return this",this)
            this._setOrder(order);
            if (order === this.env.pos.get_order()) {
                this.close();
            }
        }
        _setOrder(order) {
            this.env.pos.set_order(order);
        }


        getDate(order) {
            return moment(order.creation_date).format('YYYY-MM-DD hh:mm A');
        }
        getTotal(order) {
            return this.env.pos.format_currency(order.get_total_with_tax());
        }
        getCustomer(order) {
            return order.get_client_name();
        }
        getCardholderName(order) {
            return order.get_cardholder_name();
        }
        getEmployee(order) {
            return order.employee.name;
        }
        getStatus(order) {
            const screen = order.get_screen_data();
            return this.constants.screenToStatusMap[screen.name];
        }




        _initializeSearchFieldConstants() {
            this.constants = {};
            Object.assign(this.constants, {
                searchFieldNames: Object.keys(this._searchFields),
                screenToStatusMap: this._screenToStatusMap,
            });
        }
    }
    OrderHistoryScreen.template = 'OrderHistoryScreen';

    Registries.Component.add(OrderHistoryScreen);

    return OrderHistoryScreen;
});
