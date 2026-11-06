#include "gui/MainWindow.hpp"

#include <QApplication>
#include <QFont>

int main(int argc, char* argv[])
{
    QApplication app(argc, argv);
    QCoreApplication::setOrganizationName("Klyro");
    QCoreApplication::setApplicationName("KlyroDesktop");

    QFont baseFont("Space Grotesk");
    if (!baseFont.exactMatch()) baseFont = QFont("Inter");
    if (!baseFont.exactMatch()) baseFont = QFont("Segoe UI");
    baseFont.setPointSize(9);
    app.setFont(baseFont);

    MainWindow window;
    window.show();
    return app.exec();
}
